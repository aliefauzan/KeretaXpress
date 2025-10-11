import 'api_exception.dart'; // Import the base ApiException

class ApiAuthException extends ApiException {
  ApiAuthException({
    required String message,
    required int statusCode,
  }) : super(message: message, statusCode: statusCode);
} 