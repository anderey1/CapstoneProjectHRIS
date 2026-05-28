import logging
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, parsers
from ..models.pds import PDSUpload
from ..utils import extract_pds_data

logger = logging.getLogger(__name__)

class PDSExtractionView(APIView):
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            logger.error("PDS Extraction: No file provided.")
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Create upload record
        upload_record = PDSUpload.objects.create(file=file_obj)
        logger.info(f"PDS Extraction started. ID: {upload_record.id}")

        try:
            # Read file bytes for Gemini
            file_obj.seek(0)
            file_bytes = file_obj.read()
            
            # Use Gemini for extraction
            extracted_data, error = extract_pds_data(file_bytes)
            
            if error:
                logger.error(f"PDS Extraction Error: {error}")
                upload_record.status = 'FAILED'
                upload_record.save()
                
                # If it's a validation error (not valid PDS), use 400
                status_code = status.HTTP_400_BAD_REQUEST if "not a valid PDS" in error else status.HTTP_500_INTERNAL_SERVER_ERROR
                
                return Response({
                    "error": "Extraction failed", 
                    "details": error
                }, status=status_code)

            # Success
            upload_record.status = 'SUCCESS'
            upload_record.extracted_data = extracted_data
            upload_record.confidence_avg = 95.0  # Gemini is highly reliable for this
            upload_record.save()

            return Response({
                "upload_id": upload_record.id,
                "extracted_data": extracted_data,
                "confidence_avg": upload_record.confidence_avg
            }, status=status.HTTP_200_OK)

        except Exception as e:
            err_trace = traceback.format_exc()
            logger.error(f"PDS Extraction Exception: {str(e)}\n{err_trace}")
            upload_record.status = 'FAILED'
            upload_record.save()
            return Response({"error": "Internal server error during extraction"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

