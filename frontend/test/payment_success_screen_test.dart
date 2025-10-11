import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/payment_success_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('PaymentSuccessScreen renders and shows success message', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: PaymentSuccessScreen()));
    expect(find.text('Pembayaran Berhasil'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsWidgets);
  });
} 