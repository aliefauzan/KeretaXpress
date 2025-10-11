import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:keretaxpress/models/station.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/schedule/search_button.dart';

class TrainSearchFilterBar extends StatelessWidget {
  final List<Station> stations;
  final Station? selectedDepartureStation;
  final Station? selectedArrivalStation;
  final DateTime selectedDate;
  final String selectedTrainClass;
  final Function(Station?) onDepartureStationChanged;
  final Function(Station?) onArrivalStationChanged;
  final Function(DateTime) onDateChanged;
  final Function(String?) onTrainClassChanged;
  final VoidCallback onSearchPressed;
  final bool isLoadingStations;

  const TrainSearchFilterBar({
    super.key,
    required this.stations,
    required this.selectedDepartureStation,
    required this.selectedArrivalStation,
    required this.selectedDate,
    required this.selectedTrainClass,
    required this.onDepartureStationChanged,
    required this.onArrivalStationChanged,
    required this.onDateChanged,
    required this.onTrainClassChanged,
    required this.onSearchPressed,
    this.isLoadingStations = false,
  });

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
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
    if (picked != null && picked != selectedDate) {
      onDateChanged(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Stasiun Keberangkatan & Kedatangan',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (isLoadingStations)
              const Center(child: CircularProgressIndicator())
            else
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<Station>(
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: 'Stasiun Keberangkatan',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: const Icon(Icons.departure_board),
                      ),
                      value: selectedDepartureStation,
                      items: stations.map((station) {
                        return DropdownMenuItem<Station>(
                          value: station,
                          child: Text(station.toString(), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: onDepartureStationChanged,
                      validator: (value) => value == null ? 'Pilih stasiun' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<Station>(
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: 'Stasiun Tujuan',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.where_to_vote),
                      ),
                      value: selectedArrivalStation,
                      items: stations.map((station) {
                        return DropdownMenuItem<Station>(
                          value: station,
                          child: Text(station.toString(), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: onArrivalStationChanged,
                      validator: (value) => value == null ? 'Pilih stasiun' : null,
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _selectDate(context),
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Tanggal Keberangkatan',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: const Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        DateFormat('dd MMMM yyyy').format(selectedDate),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      labelText: 'Kelas Kereta',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                       prefixIcon: const Icon(Icons.class_),
                    ),
                    value: selectedTrainClass,
                    items: ['Semua', 'Ekonomi', 'Bisnis', 'Eksekutif']
                        .map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: onTrainClassChanged,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SearchButton(onPressed: onSearchPressed),
          ],
        ),
      ),
    );
  }
} 