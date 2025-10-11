import 'package:flutter/material.dart';

class SeatSelectionScreen extends StatefulWidget {
  final List<String> availableSeats;

  const SeatSelectionScreen({Key? key, required this.availableSeats}) : super(key: key);

  @override
  _SeatSelectionScreenState createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends State<SeatSelectionScreen> {
  String? _selectedSeat;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Your Seat'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: widget.availableSeats.length,
          itemBuilder: (context, index) {
            final seat = widget.availableSeats[index];
            final isSelected = seat == _selectedSeat;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedSeat = seat;
                });
              },
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? Colors.blue : Colors.grey[300],
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  seat,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ElevatedButton(
          onPressed: _selectedSeat == null
              ? null
              : () {
                  Navigator.pop(context, _selectedSeat);
                },
          child: const Text('Confirm Seat'),
        ),
      ),
    );
  }
}
