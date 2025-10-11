import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/widgets/booking/passenger_form.dart';
import 'package:keretaxpress/screens/payment_confirmation_screen.dart';
import 'package:keretaxpress/core/services/booking_service.dart';
import 'package:keretaxpress/core/services/auth_service.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/train/train_card.dart';
import 'package:keretaxpress/widgets/booking/payment_details_card.dart';

class PassengerInfoScreen extends StatefulWidget {
  final Train train;
  final String selectedSeat;

  const PassengerInfoScreen({
    super.key,
    required this.train,
    required this.selectedSeat,
  });

  @override
  _PassengerInfoScreenState createState() => _PassengerInfoScreenState();
}

class _PassengerInfoScreenState extends State<PassengerInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _idNumberController = TextEditingController();
  DateTime? _birthDate;
  String _gender = 'Laki-laki';

  final _bookingService = BookingService();
  bool _isLoading = false;
  String? _errorMessage;
  final String _paymentMethod = 'transfer';

  @override
  void dispose() {
    _nameController.dispose();
    _idNumberController.dispose();
    super.dispose();
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_birthDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select birth date'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = AuthService();
      final userUUID = await authService.getUserUUID();
      final bookingData = {
        'user_uuid': userUUID,
        'train_id': widget.train.id,
        'travel_date': widget.train.date,
        'passenger_name': _nameController.text,
        'passenger_gender': _gender == 'Laki-laki' ? 'male' : 'female',
        'passenger_id_number': _idNumberController.text,
        'passenger_dob': DateFormat('yyyy-MM-dd').format(_birthDate!),
        'payment_method': _paymentMethod,
        'seat_number': widget.selectedSeat,
      };

      final response = await _bookingService.book(bookingData);

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const PaymentConfirmationScreen(),
            settings: RouteSettings(
              arguments: {
                'booking': response, 
                'train': widget.train,
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_errorMessage!), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Text(
                    'Isi Data & Konfirmasi',
                    style: Theme.of(context).textTheme.displayMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),
                PassengerForm(
                  nameController: _nameController,
                  idNumberController: _idNumberController,
                  initialBirthDate: _birthDate,
                  initialGender: _gender,
                  onBirthDateChanged: (date) {
                    setState(() {
                      _birthDate = date;
                    });
                  },
                  onGenderChanged: (gender) {
                    setState(() {
                      _gender = gender;
                    });
                  },
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: TrainCard(train: widget.train, onTap: () {}),
                ),
                const SizedBox(height: 20),
                PaymentDetailsCard(
                  train: widget.train, 
                  paymentMethod: _paymentMethod, 
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitBooking,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      backgroundColor: AppTheme.primaryColor,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'SUBMIT & BAYAR',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 