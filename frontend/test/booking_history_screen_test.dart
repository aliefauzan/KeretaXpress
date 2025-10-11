import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/booking_history_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('BookingHistoryScreen renders and shows booking list', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: BookingHistoryScreen()));
    expect(find.text('Riwayat Pemesanan'), findsOneWidget);
    expect(find.byType(ListView), findsWidgets);
  });
} 