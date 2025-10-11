import 'package:keretaxpress/core/services/api_service.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';

class BookingService {
  final ApiService _api = ApiService();

  Future<dynamic> book(Map<String, dynamic> bookingData) async {
    try {
      return await _api.post('/bookings', bookingData);
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal membuat pemesanan: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> getBookingHistory(String userUuid) async {
    try {
      return await _api.get('/bookings/history?user_uuid=$userUuid');
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal memuat riwayat pemesanan: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> updateBookingStatusRemote(String transactionId, String newStatus) async {
    try {
      return await _api.put('/bookings/$transactionId/status', {'status': newStatus});
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal memperbarui status pemesanan: ${e.toString()}', statusCode: 0);
    }
  }

  Future<dynamic> uploadPaymentProof(String bookingId, String imagePath) async {
    try {
      return await _api.post('/payments/$bookingId/upload', {
        'image_path': imagePath,
      });
    } on ApiAuthException {
      rethrow;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: 'Gagal mengunggah bukti pembayaran: ${e.toString()}', statusCode: 0);
    }
  }
}
