import logging

from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .gateway import AssistantGatewayError, error_payload, execute_gateway_query
from .provider import AssistantProviderError, OpenAIAssistantProvider, assistant_unavailable_payload
from .serializers import AssistantChatSerializer, AssistantQuerySerializer

logger = logging.getLogger(__name__)


class IsPedagogicalAdmin(BasePermission):
    message = 'Utilizador sem permissao administrativa para o Assistente SIGEP.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'is_pedagogical_admin', False))


class AssistantQueryView(APIView):
    permission_classes = [IsAuthenticated, IsPedagogicalAdmin]

    def post(self, request):
        serializer = AssistantQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                error_payload('INVALID_ARGUMENTS', 'Payload invalido.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        tool_name = serializer.validated_data['tool']
        arguments = serializer.validated_data.get('arguments') or {}

        try:
            result = execute_gateway_query(request.user, tool_name, arguments)
        except AssistantGatewayError as exc:
            return Response(error_payload(exc.code, exc.message), status=exc.status_code)
        except Exception:
            logger.error(
                'assistant_gateway unexpected_error tool=%s user=%s',
                tool_name,
                getattr(request.user, 'id', None),
            )
            return Response(
                error_payload('INTERNAL_ERROR', 'Erro interno ao executar a ferramenta.'),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result.get('ok'):
            code = result.get('error', {}).get('code')
            http_status = status.HTTP_400_BAD_REQUEST
            if code == 'NOT_FOUND':
                http_status = status.HTTP_404_NOT_FOUND
            return Response(result, status=http_status)

        return Response(result, status=status.HTTP_200_OK)


class AssistantChatView(APIView):
    permission_classes = [IsAuthenticated, IsPedagogicalAdmin]

    def post(self, request):
        serializer = AssistantChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                error_payload('INVALID_ARGUMENTS', 'Payload invalido.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider = OpenAIAssistantProvider()

        try:
            result = provider.answer(
                request.user,
                serializer.validated_data['message'],
                route=serializer.validated_data.get('route', ''),
                page_context=serializer.validated_data.get('page_context', ''),
                filters=serializer.validated_data.get('filters') or {},
            )
        except AssistantProviderError as exc:
            logger.warning(
                'assistant_chat provider_error code=%s user=%s',
                exc.code,
                getattr(request.user, 'id', None),
            )
            result = assistant_unavailable_payload(exc.message)
            result['error'] = {'code': exc.code, 'message': exc.message}
        except Exception:
            logger.error(
                'assistant_chat unexpected_error user=%s',
                getattr(request.user, 'id', None),
            )
            return Response(
                error_payload('INTERNAL_ERROR', 'Erro interno ao consultar o Assistente SIGEP.'),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)
