import 'package:flutter/material.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/utils/currency_formatter.dart';
// Potentially AppTheme if specific colors are used directly, otherwise Theme.of(context) is fine

class PaymentDetailsCard extends StatelessWidget {
  final Train train;
  final String paymentMethod; // This will be 'transfer'
  final Function(String?)? onPaymentMethodChanged; // Changed to optional

  const PaymentDetailsCard({
    Key? key,
    required this.train,
    required this.paymentMethod, // Will receive 'transfer'
    this.onPaymentMethodChanged, // Changed to optional
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Detail Pembayaran',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Biaya', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(
                  currencyFormat.format(parsePrice(train.price)), // Correctly apply formatter
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.primaryColor),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Metode Pembayaran:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Transfer Bank', style: TextStyle(fontSize: 16)),
            // RadioListTile<String>(
            //   title: const Text('Virtual Account'),
            //   value: 'virtual_account',
            //   groupValue: paymentMethod,
            //   onChanged: onPaymentMethodChanged,
            //   activeColor: AppTheme.primaryColor,
            // ),
            // RadioListTile<String>(
            //   title: const Text('Credit Card'),
            //   value: 'credit_card',
            //   groupValue: paymentMethod,
            //   onChanged: onPaymentMethodChanged,
            //   activeColor: AppTheme.primaryColor,
            // ),
          ],
        ),
      ),
    );
  }
} 