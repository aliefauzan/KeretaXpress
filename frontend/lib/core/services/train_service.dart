import 'package:keretaxpress/core/services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';

class TrainService {
  final ApiService _api = ApiService();

  Future<dynamic> searchTrains({
    required String departureStation,
    required String arrivalStation,
    required DateTime date,
  }) async {
    try {
      final String formattedDate = DateFormat('yyyy-MM-dd').format(date);
      final endpoint = '/trains/search?departure_station=$departureStation&arrival_station=$arrivalStation&date=$formattedDate';
      return await _api.get(endpoint);
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal mencari kereta: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> getPromoTrains() async {
    try {
      return await _api.get('/trains/promo');
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal memuat promo kereta: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> getAllTrains() async {
    try {
      return await _api.get('/trains/all');
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal memuat semua kereta: ${e.toString()}', statusCode: 0);
    }
  }

  Future<List<String>> getAvailableSeats({
    required int trainId,
    required String date,
  }) async {
    try {
      final response = await _api.get('/trains/$trainId/available-seats?date=$date');
      if (response != null && response['available_seats'] is List) {
        return List<String>.from(response['available_seats']);
      }
      return [];
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal memuat kursi: ${e.toString()}', statusCode: 0);
    }
  }
}
