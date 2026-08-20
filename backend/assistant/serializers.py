from rest_framework import serializers

class AssistantQuerySerializer(serializers.Serializer):
    tool = serializers.CharField(max_length=80)
    arguments = serializers.DictField(required=False, default=dict)

    def validate_arguments(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Os argumentos devem ser um objecto.')
        return value
