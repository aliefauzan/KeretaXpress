import 'package:keretaxpress/core/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<dynamic> signUp(String email, String password, String name) async {
    try {
      final laravelResponse = await _api.post(
        '/register',
        {
          'email': email,
          'password': password,
          'password_confirmation': password,
          'name': name
        },
      );

      return laravelResponse;
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Registrasi gagal: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> signIn(String email, String password) async {
    try {
      final laravelResponse = await _api.post(
        '/login',
        {'email': email, 'password': password},
      );

      // Set token in ApiService if token is present in laravelResponse
      if (laravelResponse != null && laravelResponse['token'] != null) {
        _api.setToken(laravelResponse['token']);
        // Save user UUID to shared preferences if present
        if (laravelResponse['user'] != null && laravelResponse['user']['uuid'] != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_uuid', laravelResponse['user']['uuid']);
        }
      }

      return laravelResponse;
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Login gagal: ${e.toString()}', statusCode: 0);
    }
  }

  Future<String?> getUserUUID() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_uuid');
  }

  Future<void> signOut() async {
    try {
      await _api.post('/logout', {});
      _api.setToken('');
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_uuid');
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      // Consider if a specific exception is needed for logout failure
      throw ApiException(message: 'Logout gagal: ${e.toString()}', statusCode: 0);
    }
  }
}
