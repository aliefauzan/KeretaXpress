import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/register_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() {
  setUpAll(() async {
    await dotenv.testLoad(fileInput: 'LARAVEL_API_URL=http://localhost:8000\n');
  });
  testWidgets('RegisterScreen renders and has register form', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: RegisterScreen()));
    expect(find.text('Register'), findsWidgets);
    expect(find.byType(TextFormField), findsNWidgets(3));
    expect(find.byType(ElevatedButton), findsWidgets);
  });
} 