import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/home_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('HomeScreen renders and has navigation buttons', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.byType(BottomNavigationBar), findsOneWidget);
  });
} 