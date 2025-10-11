import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/schedule_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('ScheduleScreen renders and has station dropdowns', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: ScheduleScreen()));
    expect(find.text('Pilih Jadwal Keberangkatan'), findsOneWidget);
    expect(find.byType(DropdownButtonFormField), findsWidgets);
    expect(find.byType(TextField), findsOneWidget);
  });
} 