import 'package:flutter/material.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/models/booking.dart';
import 'package:keretaxpress/widgets/train/train_card.dart';
import 'package:keretaxpress/screens/payment_success_screen.dart';
import 'package:keretaxpress/screens/booking_history_screen.dart';
import 'package:keretaxpress/core/services/booking_service.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/utils/currency_formatter.dart';
import 'package:intl/intl.dart';

class PaymentConfirmationScreen extends StatefulWidget {
  const PaymentConfirmationScreen({super.key});

  @override
  _PaymentConfirmationScreenState createState() => _PaymentConfirmationScreenState();
}

class _PaymentConfirmationScreenState extends State<PaymentConfirmationScreen> {
  final BookingService _bookingService = BookingService();
  bool _isLoading = false;

  Future<void> _confirmPaymentAndNavigate(BuildContext context, Booking booking, Train train) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await _bookingService.updateBookingStatusRemote(booking.transactionId, 'confirmed');

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentSuccessScreen(
            transactionId: booking.transactionId,
            booking: booking,
            train: train,
            onStatusUpdate: (id) {
              final state = context.findAncestorStateOfType<BookingHistoryScreenState>();
              state?.updateBookingStatus(id, 'confirmed');
            },
          ),
        ),
      );
    } on ApiAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message, style: TextStyle(color: Theme.of(context).colorScheme.onError)),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'LOGIN',
            textColor: Theme.of(context).colorScheme.onError,
            onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false),
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal mengonfirmasi pembayaran: ${e.message}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
          backgroundColor: Theme.of(context).colorScheme.errorContainer,
           behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Terjadi kesalahan: ${e.toString()}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
          backgroundColor: Theme.of(context).colorScheme.errorContainer,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map;
    final booking = args['booking'] is Booking ? args['booking'] : Booking.fromJson(args['booking'] as Map<String, dynamic>);
    final train = args['train'] as Train;

    return Scaffold(
      appBar: const CustomAppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Text(
                'Konfirmasi Pembayaran',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),
            const Center(
              child: Column(
                children: [
                  Icon(
                    Icons.payment,
                    size: 50,
                    color: Colors.orange,
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Pembayaran Belum Dilakukan',
                    style: TextStyle(                    fontSize: 16,
                    color: Colors.orange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text('Silahkan lakukan pembayaran terlebih dahulu'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Transaction ID: ${booking.transactionId}',
              style: const TextStyle(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: TrainCard(train: train, onTap: () {}),
            ),
            const SizedBox(height: 20),
            const Text(
              'Detail Penumpang',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 400;
                return isWide
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(booking.passengerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text('Tanggal Lahir: ${DateFormat('dd MMMM yyyy', 'id_ID').format(DateTime.parse(booking.passengerDob))}'),
                                Text('Jenis Kelamin: ${booking.passengerGender}'),
                                Text('Kursi: ${booking.seatNumber}'),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Status Tiket: ${booking.status}'),
                                Text('Kelas: ${train.classType}'),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(booking.passengerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Tanggal Lahir: ${DateFormat('dd MMMM yyyy', 'id_ID').format(DateTime.parse(booking.passengerDob))}'),
                          Text('Jenis Kelamin: ${booking.passengerGender}'),
                          Text('Kursi: ${booking.seatNumber}'),
                          Text('Status Tiket: ${booking.status}'),
                          Text('Kelas: ${train.classType}'),
                        ],
                      );
              },
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Biaya',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  currencyFormat.format(parsePrice(booking.price)),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : () => _confirmPaymentAndNavigate(context, booking, train),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  minimumSize: const Size(double.infinity, 0),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'UPLOAD BUKTI PEMBAYARAN',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context, '/schedule', (route) => false);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  side: const BorderSide(color: AppTheme.primaryColor),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'PESAN TIKET LAIN',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  // Download ticket functionality
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  side: const BorderSide(color: AppTheme.primaryColor),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'DOWNLOAD TIKET',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}