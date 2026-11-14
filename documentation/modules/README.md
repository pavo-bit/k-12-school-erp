# Module Specifications

**Status:** Baseline  
**Owner:** Product / Engineering  
**Related:** [../03-functional-requirements.md](../03-functional-requirements.md)

Each module document follows the same structure:

1. Purpose and outcome
2. Actors and permissions
3. Release scope
4. Functional requirements
5. Business rules and invariants
6. Key data
7. APIs and events
8. Imports and exports
9. Edge cases and recovery
10. Acceptance criteria
11. Metrics and audit events
12. Open questions

## Modules

| Module                                                  | Release   |
| ------------------------------------------------------- | --------- |
| [Platform and onboarding](platform-and-onboarding.md)   | Beta      |
| [Students and admissions](students-and-admissions.md)   | Beta / GA |
| [Attendance and timetable](attendance-and-timetable.md) | Beta      |
| [Fees and payments](fees-and-payments.md)               | Beta / GA |
| [Exams and report cards](exams-and-report-cards.md)     | GA        |
| [HR and payroll](hr-and-payroll.md)                     | Beta      |
| [Communication](communication.md)                       | Beta / GA |
| [Reports and analytics](reports-and-analytics.md)       | Beta / GA |
| [Parent app](parent-app.md)                             | Beta / GA |
| [Teacher app](teacher-app.md)                           | Beta / GA |

## Requirement ID Prefixes

| Prefix    | Module                   |
| --------- | ------------------------ |
| `FR-PLAT` | Platform and onboarding  |
| `FR-STU`  | Students and admissions  |
| `FR-ATT`  | Attendance and timetable |
| `FR-FEE`  | Fees and payments        |
| `FR-EXAM` | Exams and report cards   |
| `FR-HR`   | HR and payroll           |
| `FR-COMM` | Communication            |
| `FR-REP`  | Reports and analytics    |
| `FR-PAPP` | Parent app               |
| `FR-TAPP` | Teacher app              |

Cross-cutting requirements use `FR-XCUT-*` in [../03-functional-requirements.md](../03-functional-requirements.md).
