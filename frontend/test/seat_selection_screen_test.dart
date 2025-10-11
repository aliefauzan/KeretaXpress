import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/seat_selection_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('SeatSelectionScreen renders and allows seat selection', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(
      home: SeatSelectionScreen(availableSeats: ['A1', 'A2', 'A3']),
    ));
    expect(find.text('Select Your Seat'), findsOneWidget);
    expect(find.text('A1'), findsOneWidget);
    await tester.tap(find.text('A1'));
    await tester.pump();
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
} 