import 'package:flutter/material.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/models/booking.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/widgets/train/train_card.dart';
import 'package:keretaxpress/utils/currency_formatter.dart';
import 'package:intl/intl.dart';

class PaymentSuccessScreen extends StatefulWidget {
  final String transactionId;
  final void Function(String transactionId)? onStatusUpdate;
  final Booking booking;
  final Train train;

  const PaymentSuccessScreen({
    Key? key,
    required this.transactionId,
    this.onStatusUpdate,
    required this.booking,
    required this.train,
  }) : super(key: key);

  @override
  State<PaymentSuccessScreen> createState() => _PaymentSuccessScreenState();
}

class _PaymentSuccessScreenState extends State<PaymentSuccessScreen> {
  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final train = widget.train;

    return Scaffold(
      appBar: const CustomAppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Text(
                'Detail Pemesanan Berhasil',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Column(
                children: [
                  const Icon(
                    Icons.check_circle,
                    size: 80,
                    color: AppTheme.successColor,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'PEMBAYARAN BERHASIL',
                    style: TextStyle(
                      fontSize: 18,
                      color: AppTheme.successColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text('Tiket Anda sudah aktif'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Transaction ID: ${widget.transactionId}',
              style: const TextStyle(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: TrainCard(
                train: train,
                onTap: () {}, // No action needed here
              ),
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
                                Text('Status Tiket: paid'),
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
                          Text('Status Tiket: paid'),
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
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context, '/schedule', (route) => false);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: AppTheme.primaryColor),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'PESAN TIKET LAIN',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  // Call the callback before navigating
                  widget.onStatusUpdate?.call(widget.transactionId);
                  Navigator.pushNamedAndRemoveUntil(
                    context, '/', (route) => false);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: AppTheme.primaryColor),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'KEMBALI KE BERANDA',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
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