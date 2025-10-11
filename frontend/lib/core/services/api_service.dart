import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mime/mime.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final String _baseUrl = dotenv.env['LARAVEL_API_URL']!;
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  bool isLoggedIn() {
    return _token != null && _token!.isNotEmpty;
  }

  Future<Map<String, String>> _getHeaders({bool isJson = true}) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  Future<dynamic> get(String endpoint) async {
    try {
      final cleanBaseUrl = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
      final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      final url = '$cleanBaseUrl/$cleanEndpoint';

      final response = await http.get(
        Uri.parse(url),
        headers: await _getHeaders(),
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> post(String endpoint, dynamic data) async {
    try {
      final cleanBaseUrl = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
      final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      final url = '$cleanBaseUrl/$cleanEndpoint';

      final response = await http.post(
        Uri.parse(url),
        headers: await _getHeaders(),
        body: jsonEncode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> put(String endpoint, dynamic data) async {
    try {
      final cleanBaseUrl = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
      final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      final url = '$cleanBaseUrl/$cleanEndpoint';

      final response = await http.put(
        Uri.parse(url),
        headers: await _getHeaders(),
        body: jsonEncode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> delete(String endpoint) async {
    try {
      final cleanBaseUrl = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
      final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      final url = '$cleanBaseUrl/$cleanEndpoint';

      final response = await http.delete(
        Uri.parse(url),
        headers: await _getHeaders(),
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> postMultipart(String endpoint, File file, String fieldName, {Map<String, String>? fields}) async {
    try {
      final cleanBaseUrl = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
      final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      final url = Uri.parse('$cleanBaseUrl/$cleanEndpoint');

      final request = http.MultipartRequest('POST', url);

      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      if (fields != null) {
        request.fields.addAll(fields);
      }

      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
      final mimeTypeSplit = mimeType.split('/');

      request.files.add(
        await http.MultipartFile.fromPath(
          fieldName,
          file.path,
          contentType: MediaType(mimeTypeSplit[0], mimeTypeSplit[1]),
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  dynamic _handleResponse(http.Response response) {
    final String responseBody = response.body;
    dynamic responseData;
    try {
      responseData = jsonDecode(responseBody);
    } catch (e) {
      responseData = {'message': responseBody.isNotEmpty ? responseBody : 'Invalid response from server'};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return responseData;
    } else if (response.statusCode == 401) {
      throw ApiAuthException(
        message: responseData['message'] ?? 'Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.',
        statusCode: response.statusCode,
      );
    } else {
      throw ApiException(
        message: responseData['message'] ?? 'Terjadi kesalahan. Coba beberapa saat lagi.',
        statusCode: response.statusCode,
        errors: responseData['errors'] is Map<String, dynamic> ? responseData['errors'] : null,
      );
    }
  }

  Exception _handleError(dynamic error) {
    if (error is ApiException || error is ApiAuthException) {
      return error;
    }
    if (error is SocketException) {
        return ApiException(message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.", statusCode: 0);
    }
    return ApiException(
      message: "Terjadi kesalahan jaringan atau koneksi: ${error.toString()}",
      statusCode: 500, 
    );
  }
}
