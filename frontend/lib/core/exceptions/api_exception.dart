class ApiException implements Exception {
  final String message;
  final int statusCode;
  final Map<String, dynamic>? errors;

  ApiException({
    required this.message,
    required this.statusCode,
    this.errors,
  });

  @override
  String toString() => '[$statusCode] $message ${errors != null ? '\\nErrors: $errors' : ''}';
} 