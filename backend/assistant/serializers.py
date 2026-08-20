from rest_framework import serializers


class AssistantQuerySerializer(serializers.Serializer):
    tool = serializers.CharField(max_length=80)
    arguments = serializers.DictField(required=False, default=dict)

    def validate_arguments(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Os argumentos devem ser um objecto.')
        return value


class AssistantChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1200, allow_blank=False, trim_whitespace=True)
    route = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    page_context = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    filters = serializers.DictField(required=False, default=dict)

    def validate_filters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Os filtros devem ser um objecto.')
        return value
