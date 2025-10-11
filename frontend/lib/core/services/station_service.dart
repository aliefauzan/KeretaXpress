import 'package:keretaxpress/core/services/api_service.dart';

class StationService {
  final ApiService _api = ApiService();

  Future<dynamic> getAllStations() async {
    try {
      return await _api.get('/stations');
    } catch (e) {
      throw StationException('Failed to fetch stations: ${e.toString()}');
    }
  }
}

class StationException implements Exception {
  final String message;

  StationException(this.message);

  @override
  String toString() => message;
} 