import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/passenger_data_screen.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('PassengerDataScreen renders and has form fields', (WidgetTester tester) async {
    final train = Train.dummy();
    await tester.pumpWidget(MaterialApp(
      home: PassengerDataScreen(train: train, selectedSeat: 'A1'),
    ));
    expect(find.text('Isi Data Penumpang'), findsOneWidget);
    expect(find.byType(TextFormField), findsWidgets);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
} 