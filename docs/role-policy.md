# Account roles

System administrators are IT accounts with `is_superuser=True` and no staff role. The `admin` account keeps its password and superuser access. School configuration remains superuser-only.

Staff roles are HR, Accountant, Superintendent, School Principal, Teaching Staff, and Non-Teaching Staff. HR and Accountant are separate account roles, not aliases for Non-Teaching Staff. Non-superusers must have a staff role.

The Administrative Staff account role was retired on 2026-11-18. Its removal does not remove shared management features, administrative job titles, leave-processing assignments, or official form labels. Other staff roles retain their existing permissions.

## Migration 0027

- Deletes `elena.torres` and her employee profile, including records that cascade from that profile. In the local database this includes two payroll records. Audit entries remain, with their deleted actor reference cleared.
- Clears the retired staff role on superusers and ensures the existing `admin` superuser has no staff role.
- Converts any other accounts with the retired role to Non-Teaching Staff without granting management privileges.
- Removes the retired role choice and requires a staff role for non-superusers.

Back up the database before applying this migration. Account deletion is irreversible through Django migrations; recovery requires restoring the backup. Historical migrations and audit documents retain references to the retired role so database history and earlier findings remain understandable.

Sign out and back in after migration to refresh the role stored in the browser's authentication token.
