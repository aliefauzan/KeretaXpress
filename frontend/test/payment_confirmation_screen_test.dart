import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/payment_confirmation_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('PaymentConfirmationScreen renders and shows payment info', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: PaymentConfirmationScreen()));
    expect(find.text('Konfirmasi Pembayaran'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsWidgets);
  });
} 