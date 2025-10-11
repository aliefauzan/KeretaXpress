import 'package:flutter/material.dart';
import 'package:keretaxpress/screens/home_screen.dart';
import 'package:keretaxpress/screens/login_screen.dart';
import 'package:keretaxpress/screens/register_screen.dart';
import 'package:keretaxpress/screens/schedule_screen.dart';
import 'package:keretaxpress/screens/passenger_info_screen.dart';
import 'package:keretaxpress/screens/booking_history_screen.dart';
import 'package:keretaxpress/screens/payment_confirmation_screen.dart';
import 'package:keretaxpress/screens/payment_success_screen.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/models/booking.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/date_symbol_data_local.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID', null);
  
  await dotenv.load(fileName: '.env');
  
  runApp(const KeretaXpressApp());
}

class KeretaXpressApp extends StatelessWidget {
  const KeretaXpressApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KeretaXpress',
      theme: AppTheme.theme,
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/home': (context) => const HomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/schedule': (context) => const ScheduleScreen(),
        '/booking-history': (context) => const BookingHistoryScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/passenger-data') {
          if (settings.arguments is Map) {
            final args = settings.arguments as Map;
            final train = args['train'] as Train?;
            final selectedSeat = args['selectedSeat'] as String?;

            if (train != null && selectedSeat != null) {
              return MaterialPageRoute(
                builder: (context) => PassengerInfoScreen(train: train, selectedSeat: selectedSeat),
              );
            }
          }
          // Fallback for incorrect arguments
          return MaterialPageRoute(builder: (_) => const Scaffold(body: Center(child: Text("Error: Invalid arguments for page"))));
        }
        // Keep existing handlers for /payment-confirmation and /payment-success
        if (settings.name == '/payment-confirmation') {
          return MaterialPageRoute(
            builder: (context) => const PaymentConfirmationScreen(),
            settings: settings,
          );
        }
        if (settings.name == '/payment-success') {
           final args = settings.arguments as Map<String, dynamic>;
           final String transactionId = args['transactionId'] as String;
           final Booking booking = args['booking'] as Booking;
           final Train train = args['train'] as Train;
           final Function(String)? onStatusUpdate = args['onStatusUpdate'] as Function(String)?;

          return MaterialPageRoute(
            builder: (context) => PaymentSuccessScreen(
              transactionId: transactionId,
              booking: booking,
              train: train,
              onStatusUpdate: onStatusUpdate,
            ),
          );
        }
        return null; // Important for other routes or unhandled cases
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
