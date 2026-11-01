"""Check extracted Python definitions and the public router against a baseline.

Run with backend/venv/Scripts/python.exe from the repository root.
This reads source and route configuration, never employee data.
"""
import argparse
import ast
import copy
import json
from importlib.util import resolve_name
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def resolved_tree(tree, package):
    """Compare imports by their target, including imports inside moved methods."""
    tree = copy.deepcopy(tree)
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.level:
            node.module = resolve_name('.' * node.level + (node.module or ''), package)
            node.level = 0
    return tree


def verify_sources(source_ref):
    groups = {
        'backend/core/utils/__init__.py': ROOT / 'backend/core/utils',
        **{f'backend/core/views/{name}.py': ROOT / f'backend/core/views/{name}'
           for name in ('employee', 'leave', 'loan', 'payroll')},
    }
    checked = 0
    for original, directory in groups.items():
        before = ast.parse(subprocess.check_output(
            ['git', 'show', f'{source_ref}:{original}'], cwd=ROOT, encoding='utf-8',
        ))
        package = 'core.utils' if original.endswith('utils/__init__.py') else 'core.views'
        before = resolved_tree(before, package)
        after = [resolved_tree(ast.parse(path.read_text(encoding='utf-8')),
                               '.'.join(path.parent.relative_to(ROOT / 'backend').parts))
                 for path in directory.glob('*.py')]
        definitions = {ast.dump(node, include_attributes=False)
                       for tree in after for node in ast.walk(tree)
                       if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
        for node in ast.walk(before):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if ast.dump(node, include_attributes=False) not in definitions:
                    raise AssertionError(f'Changed definition: {original}:{node.name}')
                checked += 1
    print(f'PASS: {checked} original Python functions equivalent, including resolved imports, signatures and decorators')
    verify_onboarding_extraction(source_ref)


def verify_onboarding_extraction(source_ref):
    """Inline the extracted record helpers to compare the original status operation."""
    original = ast.parse(subprocess.check_output(
        ['git', 'show', f'{source_ref}:backend/core/views/recruitment.py'],
        cwd=ROOT, encoding='utf-8',
    ))
    current = ast.parse((ROOT / 'backend/core/views/recruitment.py').read_text(encoding='utf-8'))
    service = ast.parse((ROOT / 'backend/core/services/onboarding.py').read_text(encoding='utf-8'))
    records = ast.parse((ROOT / 'backend/core/services/applicant_records.py').read_text(encoding='utf-8'))
    helpers = {node.name: node for node in records.body if isinstance(node, ast.FunctionDef)}

    class ExpandRecords(ast.NodeTransformer):
        def visit_Expr(self, node):
            if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
                if node.value.func.id in helpers:
                    return copy.deepcopy(helpers[node.value.func.id].body)
            return node

    class RestoreNames(ast.NodeTransformer):
        def visit_Name(self, node):
            if node.id == 'actor':
                return ast.Attribute(value=ast.Name(id='request', ctx=ast.Load()), attr='user', ctx=ast.Load())
            if node.id == 'extractor':
                return ast.Name(id='extract_pds_data', ctx=node.ctx)
            return node

    transaction = next(node for node in ast.walk(service) if isinstance(node, ast.With))
    transaction = RestoreNames().visit(ExpandRecords().visit(copy.deepcopy(transaction)))
    before = next(node for node in ast.walk(original) if isinstance(node, ast.FunctionDef) and node.name == 'change_status')
    after = next(node for node in ast.walk(current) if isinstance(node, ast.FunctionDef) and node.name == 'change_status')
    for node in ast.walk(after):
        if isinstance(node, ast.If) and len(node.body) == 1:
            statement = node.body[0]
            if isinstance(statement, ast.Assign) and isinstance(statement.value, ast.Call):
                if isinstance(statement.value.func, ast.Name) and statement.value.func.id == 'onboard_applicant':
                    node.body = [transaction]
    if ast.dump(before, include_attributes=False) != ast.dump(after, include_attributes=False):
        raise AssertionError('Recruitment behavior changed after expanding the extracted services')
    print('PASS: recruitment status workflow unchanged after expanding onboarding services')


def api_contract(router_override=None):
    sys.path.insert(0, str(ROOT / 'backend'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    import django
    django.setup()
    from core.urls import router

    def policy(value):
        if hasattr(value, '__name__'):
            return value.__name__
        return [value.operator_class.__name__, policy(value.op1_class), policy(value.op2_class)]

    return [
        {
            'pattern': str(url.pattern),
            'name': url.name,
            'actions': getattr(url.callback, 'actions', {}),
            'kwargs': {
                key: [policy(p) for p in value] if key == 'permission_classes' else value
                for key, value in getattr(url.callback, 'initkwargs', {}).items()
                if key in ('permission_classes', 'detail', 'url_path', 'url_name')
            },
        }
        for url in (router_override or router).urls
    ]


def verify_routes(source_ref):
    current = api_contract()
    from core.urls import router
    from rest_framework.routers import DefaultRouter

    replacements = {}
    for module, class_name in (
        ('employee', 'EmployeeViewSet'), ('employee', 'EmployeeDocumentViewSet'),
        ('employee', 'SchoolViewSet'), ('employee', 'SalaryGradeViewSet'),
        ('leave', 'LeaveViewSet'), ('loan', 'LoanViewSet'),
        ('payroll', 'PayrollViewSet'), ('recruitment', 'ApplicantViewSet'),
    ):
        source = subprocess.check_output(
            ['git', 'show', f'{source_ref}:backend/core/views/{module}.py'],
            cwd=ROOT, encoding='utf-8',
        )
        namespace = {'__name__': f'core.views._baseline_{module}', '__package__': 'core.views'}
        exec(compile(source, f'<baseline {module}>', 'exec'), namespace)
        replacements[class_name] = namespace[class_name]
    baseline = DefaultRouter()
    for prefix, viewset, basename in router.registry:
        baseline.register(prefix, replacements.get(viewset.__name__, viewset), basename=basename)
    if current != api_contract(baseline):
        raise AssertionError('API patterns, names, HTTP actions or action permissions changed')
    print(f'PASS: {len(current)} API route contracts unchanged against {source_ref}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-ref', help='Git revision before the extraction')
    parser.add_argument('--capture-api', type=Path, help='Write a route baseline before refactoring')
    parser.add_argument('--compare-api', type=Path, help='Compare current routes with a captured baseline')
    args = parser.parse_args()
    if not any((args.source_ref, args.capture_api, args.compare_api)):
        parser.error('Supply --source-ref, --capture-api or --compare-api')
    if args.source_ref:
        verify_sources(args.source_ref)
        verify_routes(args.source_ref)
    if args.capture_api:
        contract = api_contract()
        args.capture_api.write_text(json.dumps(contract, sort_keys=True, indent=2), encoding='utf-8')
        print(f'Captured {len(contract)} API routes')
    if args.compare_api:
        contract = api_contract()
        expected = json.loads(args.compare_api.read_text(encoding='utf-8'))
        if contract != expected:
            raise AssertionError('API patterns, names, HTTP actions or action permissions changed')
        print(f'PASS: {len(contract)} API route contracts unchanged')


if __name__ == '__main__':
    main()
