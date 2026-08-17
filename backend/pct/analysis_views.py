from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .analytics import ano_lectivo_analysis, classe_analysis, individual_analysis, turma_analysis


class PCTIndividualAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(individual_analysis(request.query_params))


class PCTTurmaAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(turma_analysis(request.query_params))


class PCTClasseAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(classe_analysis(request.query_params))


class PCTAnoLectivoAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ano_lectivo_analysis(request.query_params))
