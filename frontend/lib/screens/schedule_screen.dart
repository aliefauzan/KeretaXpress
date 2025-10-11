import 'package:flutter/material.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/screens/passenger_info_screen.dart';
import 'package:keretaxpress/core/services/train_service.dart';
import 'package:keretaxpress/core/services/station_service.dart';
import 'package:keretaxpress/models/station.dart';
import 'package:keretaxpress/screens/seat_selection_screen.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';
import 'package:keretaxpress/widgets/schedule/train_search_filter_bar.dart';
import 'package:keretaxpress/widgets/schedule/train_list_results.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  _ScheduleScreenState createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  final TrainService _trainService = TrainService();
  final StationService _stationService = StationService();
  List<Train> _trains = [];
  List<Station> _stations = [];
  Station? _selectedDepartureStation;
  Station? _selectedArrivalStation;
  bool _isLoading = true;
  String _searchQuery = '';
  DateTime _selectedDate = DateTime.now();
  String? _errorMessage;
  bool _showAllTrains = false;
  String _trainClassFilter = 'Semua';

  @override
  void initState() {
    super.initState();
    _initializeData(showAll: true);
  }

  Future<void> _initializeData({bool showAll = false}) async {
    try {
      await _fetchStations();
      if (_stations.isNotEmpty) {
        if (showAll) {
          await _fetchAllTrains();
        } else {
          await _fetchTrains();
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to initialize data: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchStations() async {
    try {
      final response = await _stationService.getAllStations();
      if (response != null && response is List) {
        setState(() {
          _stations = response.map((data) => Station.fromJson(data)).toList();
          if (_stations.isNotEmpty) {
            _selectedDepartureStation = _stations.first;
            _selectedArrivalStation = _stations.length > 1 ? _stations[1] : _stations.first;
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load stations: $e';
        _isLoading = false;
      });
      rethrow;
    }
  }

  Future<void> _fetchTrains() async {
    if (_selectedDepartureStation == null || _selectedArrivalStation == null) {
      setState(() {
        _errorMessage = 'Please select both departure and arrival stations.';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _trainService.searchTrains(
        departureStation: _selectedDepartureStation!.id.toString(),
        arrivalStation: _selectedArrivalStation!.id.toString(),
        date: _selectedDate,
      );

      if (response != null && response['trains'] != null && response['trains'] is List) {
        setState(() {
          _trains = (response['trains'] as List)
            .map((data) => Train.fromJson(data, stations: _stations))
            .toList();
          _isLoading = false;
          _showAllTrains = false;
        });
      } else {
        setState(() {
          _trains = [];
          _isLoading = false;
          _errorMessage = 'No trains found for the selected criteria.';
        });
      }
    } catch (e) {
      setState(() {
        _trains = [];
        _isLoading = false;
        _errorMessage = 'Failed to load trains: $e';
      });
    }
  }

  Future<void> _fetchAllTrains() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _trainService.getAllTrains();
      if (response != null && response['trains'] != null && response['trains'] is List) {
        setState(() {
          _trains = (response['trains'] as List)
            .map((data) => Train.fromJson(data, stations: _stations))
            .toList();
          _isLoading = false;
          _showAllTrains = true;
        });
      } else {
        setState(() {
          _trains = [];
          _isLoading = false;
          _errorMessage = 'No trains available.';
          _showAllTrains = true;
        });
      }
    } catch (e) {
      setState(() {
        _trains = [];
        _isLoading = false;
        _errorMessage = 'Failed to load trains: $e';
        _showAllTrains = true;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
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
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredTrains = _trains.where((train) {
      final query = _searchQuery.toLowerCase();
      final matchesClass = _trainClassFilter == 'Semua' || train.classType == _trainClassFilter;
      return (train.name.toLowerCase().contains(query) ||
          train.departure.toLowerCase().contains(query) ||
          train.arrival.toLowerCase().contains(query)) && matchesClass;
    }).toList();

    return Scaffold(
      appBar: const CustomAppBar(),
      body: RefreshIndicator(
        onRefresh: _initializeData,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ListView(
            children: [
              Center(
                child: Text(
                  'Pilih Jadwal Keberangkatan',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
              TrainSearchFilterBar(
                stations: _stations,
                selectedDepartureStation: _selectedDepartureStation,
                selectedArrivalStation: _selectedArrivalStation,
                selectedDate: _selectedDate,
                selectedTrainClass: _trainClassFilter,
                isLoadingStations: _isLoading && _stations.isEmpty,
                onDepartureStationChanged: (station) {
                  setState(() {
                    _selectedDepartureStation = station;
                  });
                },
                onArrivalStationChanged: (station) {
                  setState(() {
                    _selectedArrivalStation = station;
                  });
                },
                onDateChanged: (date) {
                  setState(() {
                    _selectedDate = date;
                  });
                },
                onTrainClassChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _trainClassFilter = value;
                    });
                  }
                },
                onSearchPressed: () {
                  _fetchTrains();
                },
              ),
              const SizedBox(height: 20),
              TextField(
                decoration: InputDecoration(
                  hintText: 'Cari Kereta...',
                  hintStyle: TextStyle(fontSize: 14),
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                style: TextStyle(fontSize: 14),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
              const SizedBox(height: 20),
              TrainListResults(
                trains: filteredTrains,
                isLoading: _isLoading,
                errorMessage: _errorMessage,
                onRefresh: () => _initializeData(showAll: _showAllTrains),
                onTrainTap: (train) async {
                  try {
                    final availableSeats = await _trainService.getAvailableSeats(
                      trainId: int.parse(train.id as String),
                      date: train.date,
                    );
                    if (!mounted) return;

                    final selectedSeat = await Navigator.push<String>(
                      context,
                      MaterialPageRoute(
                        builder: (context) => SeatSelectionScreen(availableSeats: availableSeats),
                      ),
                    );

                    if (selectedSeat != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => PassengerInfoScreen(
                            train: train,
                            selectedSeat: selectedSeat,
                          ),
                        ),
                      );
                    }
                  } on ApiAuthException catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Anda harus login untuk melihat detail kursi dan melanjutkan pemesanan.',
                          style: TextStyle(color: Theme.of(context).colorScheme.onError)
                        ),
                        backgroundColor: Theme.of(context).colorScheme.error,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        margin: const EdgeInsets.all(10),
                        action: SnackBarAction(
                          label: 'LOGIN',
                          textColor: Theme.of(context).colorScheme.onError,
                          onPressed: () {
                            Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                          },
                        ),
                      ),
                    );
                  } on ApiException catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Gagal memuat kursi: ${e.message}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
                        backgroundColor: Theme.of(context).colorScheme.errorContainer,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        margin: const EdgeInsets.all(10),
                      ),
                    );
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Terjadi kesalahan saat memuat kursi: ${e.toString()}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
                        backgroundColor: Theme.of(context).colorScheme.errorContainer,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        margin: const EdgeInsets.all(10),
                      ),
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
