import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:keretaxpress/utils/theme.dart';

class PassengerForm extends StatefulWidget {
  final TextEditingController nameController;
  final TextEditingController idNumberController;
  final Function(DateTime?) onBirthDateChanged;
  final Function(String) onGenderChanged;
  final DateTime? initialBirthDate;
  final String initialGender;

  const PassengerForm({
    super.key,
    required this.nameController,
    required this.idNumberController,
    required this.onBirthDateChanged,
    required this.onGenderChanged,
    this.initialBirthDate,
    required this.initialGender,
  });

  @override
  _PassengerFormState createState() => _PassengerFormState();
}

class _PassengerFormState extends State<PassengerForm> {
  DateTime? _birthDate;
  late String _gender;

  @override
  void initState() {
    super.initState();
    _birthDate = widget.initialBirthDate;
    _gender = widget.initialGender;
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _birthDate) {
      setState(() {
        _birthDate = picked;
      });
      widget.onBirthDateChanged(_birthDate);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: widget.nameController,
          decoration: const InputDecoration(
            labelText: 'Nama Penumpang',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.person),
          ),
          validator: (value) =>
              value == null || value.isEmpty ? 'Nama wajib diisi' : null,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: widget.idNumberController,
          decoration: const InputDecoration(
            labelText: 'Nomor Identitas',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.badge),
          ),
          validator: (value) =>
              value == null || value.isEmpty ? 'Nomor identitas wajib diisi' : null,
        ),
        const SizedBox(height: 16),
        InkWell(
          onTap: () => _selectDate(context),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Tanggal Lahir',
              border: const OutlineInputBorder(),
              prefixIcon: const Icon(Icons.calendar_today),
              errorText: widget.initialBirthDate == null && _birthDate == null ? 'Tanggal lahir wajib diisi' : null,
            ),
            child: Text(
              _birthDate == null
                  ? 'Pilih tanggal'
                  : DateFormat('dd MMMM yyyy').format(_birthDate!),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Jenis Kelamin', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
        Row(
          children: [
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Laki-laki'),
                value: 'Laki-laki',
                groupValue: _gender,
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _gender = value;
                    });
                    widget.onGenderChanged(value);
                  }
                },
              ),
            ),
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Perempuan'),
                value: 'Perempuan',
                groupValue: _gender,
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _gender = value;
                    });
                    widget.onGenderChanged(value);
                  }
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
} 