import 'package:flutter/material.dart';
import 'package:keretaxpress/utils/theme.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/core/services/api_service.dart';
import 'package:keretaxpress/core/services/station_service.dart';
import 'package:keretaxpress/models/station.dart';
import 'package:intl/intl.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoggedIn = false;
  final StationService _stationService = StationService();
  List<Station> _stations = [];
  Station? _selectedDepartureStation;
  Station? _selectedArrivalStation;
  DateTime _selectedDate = DateTime.now();
  bool _isLoadingStations = true;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
    _fetchStations();
  }

  void _checkLoginStatus() {
    final apiService = ApiService();
    setState(() {
      _isLoggedIn = apiService.isLoggedIn();
    });
  }

  Future<void> _fetchStations() async {
    setState(() {
      _isLoadingStations = true;
    });
    try {
      final response = await _stationService.getAllStations();
      if (response != null && response is List) {
        setState(() {
          _stations = response.map((data) => Station.fromJson(data)).toList();
          if (_stations.isNotEmpty) {
            _selectedDepartureStation = _stations.first;
            _selectedArrivalStation = _stations.length > 1 ? _stations[1] : _stations.first;
          }
          _isLoadingStations = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingStations = false;
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
    return Scaffold(
      appBar: const CustomAppBar(),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    _buildHeroSection(context),
                    const SizedBox(height: 40),
                    _buildSearchCard(context),
                    const SizedBox(height: 40),
                    _buildPromoSection(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
          if (!_isLoggedIn) _buildAuthButtons(context),
        ],
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const Text(
            'SELAMAT DATANG DI KERETAXPRESS',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 15),
          const Text(
            'Nikmati kemudahan memesan tiket kereta dengan harga terbaik',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSearchCard(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            const Text(
              'Cari Tiket Kereta',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            _isLoadingStations
                ? const CircularProgressIndicator()
                : Column(
                    children: [
                      DropdownButtonFormField<Station>(
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: 'Stasiun Asal',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          prefixIcon: const Icon(Icons.train),
                        ),
                        value: _selectedDepartureStation,
                        items: _stations.map((station) {
                          return DropdownMenuItem<Station>(
                            value: station,
                            child: Text(station.toString()),
                          );
                        }).toList(),
                        onChanged: (Station? newValue) {
                          if (newValue != null) {
                            setState(() {
                              _selectedDepartureStation = newValue;
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 15),
                      DropdownButtonFormField<Station>(
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: 'Stasiun Tujuan',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          prefixIcon: const Icon(Icons.train),
                        ),
                        value: _selectedArrivalStation,
                        items: _stations.map((station) {
                          return DropdownMenuItem<Station>(
                            value: station,
                            child: Text(station.toString()),
                          );
                        }).toList(),
                        onChanged: (Station? newValue) {
                          if (newValue != null) {
                            setState(() {
                              _selectedArrivalStation = newValue;
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 15),
                      InkWell(
                        onTap: () => _selectDate(context),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Tanggal Berangkat',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            prefixIcon: const Icon(Icons.calendar_today),
                          ),
                          child: Text(
                            DateFormat('dd/MM/yyyy').format(_selectedDate),
                          ),
                        ),
                      ),
                    ],
                  ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/schedule');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'CARI KERETA',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Promo Spesial',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildPromoCard('Diskon 20%', 'assets/images/promo1.png'),
              const SizedBox(width: 15),
              _buildPromoCard('Cashback 10%', 'assets/images/promo2.png'),
              const SizedBox(width: 15),
              _buildPromoCard('Tiket Murah', 'assets/images/promo3.png'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPromoCard(String title, String imagePath) {
    return Container(
      width: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        image: DecorationImage(
          image: AssetImage(imagePath),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.7),
              Colors.transparent,
            ],
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Syarat & Ketentuan berlaku',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthButtons(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/login');
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
                side: const BorderSide(color: AppTheme.primaryColor),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'MASUK',
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/register');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'DAFTAR',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}