import hashlib
import json
import logging
import os

from django.core.cache import cache
from google import genai
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.services.dashboard_analytics import operational_dashboard

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def operations(request):
    return Response(operational_dashboard(request.user))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insight(request, metric):
    dashboard = operational_dashboard(request.user)
    chart = next((item for item in dashboard['charts'] if item['key'] == metric), None)
    if chart is None:
        return Response({'detail': 'Analytics not available in your dashboard.'}, status=404)
    fallback = dict(source='data', text=chart['insight'], available=False)
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        return Response({**fallback, 'message': 'AI summary is unavailable. The data-based insight remains available.'})
    # No identities, documents, health details or personal financial amounts go to AI.
    # Personal dashboards send counts only; financial explanations remain local.
    if dashboard['scope'] == 'personal' and chart['unit'] == 'PHP':
        return Response({**fallback, 'message': 'Personal payroll amounts are explained locally.'})
    context = {field: chart[field] for field in ('title', 'data', 'unit', 'period', 'note')}
    cache_key = 'operations-insight:' + str(request.user.pk) + ':' + hashlib.sha256(json.dumps(context, sort_keys=True).encode()).hexdigest()
    result = cache.get(cache_key)
    if result:
        return Response(result)
    try:
        client = genai.Client(api_key=key, http_options={'timeout': 15000})
        response = client.models.generate_content(model='gemini-2.5-flash-lite', contents=(
            'Explain these aggregate business-operation figures in two short plain-language sentences. '
            'Use only the supplied facts and reporting period. Do not infer causes, trends without time-series evidence, '
            'staffing adequacy, compliance, employee merit, promotion, creditworthiness or financial health. '
            'Do not invent targets, forecasts or policies. Explain the limitation provided. Data: ' + json.dumps(context)))
        if not response.text or not response.text.strip():
            raise ValueError('Empty summary')
        result = dict(source='ai', text=response.text.strip(), available=True)
        cache.set(cache_key, result, 900)
        return Response(result)
    except Exception:
        logger.warning('Operational AI summary unavailable for metric %s', metric)
        return Response({**fallback, 'message': 'AI summary could not be generated. The data-based insight remains available.'})
