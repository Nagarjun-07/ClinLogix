import json
from fhir.resources.encounter import Encounter
from fhir.resources.bundle import Bundle
import uuid

# Sample payload mimicking full Bundle from backend
sample_bundle = {
  "resourceType": "Bundle",
  "type": "collection",
  "identifier": {
    "system": "http://clinlogix.org/fhir/student-logs",
    "value": str(uuid.uuid4())
  },
  "entry": [
    {
      "fullUrl": f"urn:uuid:{uuid.uuid4()}",
      "resource": {
        "resourceType": "Encounter",
        "id": str(uuid.uuid4()),
        "text": {
             "status": "generated",
             "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">Encounter narrative</div>"
        },
        "status": "finished",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        },
        "subject": {
            "reference": "Patient/123",
            "display": "Patient John Doe"
        },
        "participant": [
            {
                "type": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                                "code": "PPRF",
                                "display": "primary performer"
                            }
                        ]
                    }
                ],
                "individual": {
                    "reference": "Practitioner/abc-123",
                    "display": "Student Name"
                }
            }
        ],
        "period": {
            "start": "2026-01-08"
        },
        "serviceType": {
            "text": "Cardiology"
        },
        "extension": [
            {
                "url": "http://clinlogix.org/fhir/StructureDefinition/clinical-hours",
                "valueDecimal": 4.5
            },
            {
                "url": "http://clinlogix.org/fhir/StructureDefinition/student-reflection",
                "valueString": "Great learning experience"
            }
        ]
      }
    }
  ]
}

print("Validating Bundle Resource...")

try:
    # Validate strictly using fhir.resources
    bundle = Bundle.parse_obj(sample_bundle)
    print("✅ Bundle is VALID!")
    # print(bundle.json(indent=2))
except Exception as e:
    print("❌ Validation Failed!")
    print(e)
except Exception as e:
    print("❌ Validation Failed!")
    print(e)
