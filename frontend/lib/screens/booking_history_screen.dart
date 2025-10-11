import 'package:flutter/material.dart';
import 'package:keretaxpress/models/booking.dart';
import 'package:keretaxpress/widgets/app_bar.dart';
import 'package:keretaxpress/core/services/booking_service.dart';
import 'package:keretaxpress/core/services/auth_service.dart';
import 'package:keretaxpress/widgets/booking/booking_card.dart';
import 'package:keretaxpress/core/exceptions/api_auth_exception.dart';
import 'package:keretaxpress/core/exceptions/api_exception.dart';
import 'package:keretaxpress/models/train.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  BookingHistoryScreenState createState() => BookingHistoryScreenState();
}

class BookingHistoryScreenState extends State<BookingHistoryScreen> {
  late Future<List<Booking>> _futureBookings;
  final BookingService _bookingService = BookingService();
  bool _isLoadingAction = false;
  String _selectedStatusFilter = 'Semua';

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  void _loadBookings() {
    setState(() {
      _futureBookings = _fetchBookings();
    });
  }

  Future<List<Booking>> _fetchBookings() async {
    try {
      final authService = AuthService();
      final userUuid = await authService.getUserUUID();
      if (userUuid == null) {
        throw ApiAuthException(message: "Anda harus login untuk melihat riwayat.", statusCode: 401);
      }
      final data = await _bookingService.getBookingHistory(userUuid);
      if (data is List) {
        return data.map((json) => Booking.fromJson(json)).toList();
      }
      return [];
    } on ApiAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "Anda harus login untuk melihat riwayat.",
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
      }
      return [];
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
          ),
        );
      }
      return [];
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Terjadi kesalahan tidak terduga saat memuat riwayat: ${e.toString()}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
          ),
        );
      }
      return [];
    }
  }

  Future<void> _onRefresh() async {
    _loadBookings();
    await _futureBookings;
  }

  void _uploadPaymentProof(Booking booking) async {
    setState(() { _isLoadingAction = true; });
    try {
      await _bookingService.updateBookingStatusRemote(booking.transactionId, 'confirmed');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Status booking ${booking.transactionId} berhasil diubah menjadi confirmed.',
              style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer),
            ),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
          ),
        );
        _loadBookings();
      }
    } on ApiAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message, style: TextStyle(color: Theme.of(context).colorScheme.onError)),
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
      }
    } on ApiException catch (e) {
       if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengubah status: ${e.message}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
          ),
        );
      }
    } catch (e) {
       if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Terjadi kesalahan tidak terduga saat mengubah status: ${e.toString()}', style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
          ),
        );
      }
    }
    finally {
      if (mounted) {
         setState(() { _isLoadingAction = false; });
      }
    }
  }

  void updateBookingStatus(String transactionId, String newStatus) {
    _loadBookings();
    if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Memuat ulang riwayat setelah status diperbarui untuk $transactionId...',
               style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer),
            ),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(10),
            duration: const Duration(seconds: 2),
          ),
        );
    }
  }

  void _downloadTicket(Booking booking) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Download ticket for booking ${booking.transactionId}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Text(
                  'Riwayat Pemesanan',
                  style: Theme.of(context).textTheme.displayMedium,
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: DropdownButtonFormField<String>(
                  value: _selectedStatusFilter,
                  decoration: InputDecoration(
                    labelText: 'Filter Status',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Icons.filter_list),
                  ),
                  items: <String>['Semua', 'pending', 'confirmed']
                      .map<DropdownMenuItem<String>>((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value[0].toUpperCase() + value.substring(1)),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      setState(() {
                        _selectedStatusFilter = newValue;
                      });
                    }
                  },
                ),
              ),
              FutureBuilder<List<Booking>>(
                future: _futureBookings,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (snapshot.hasError) {
                    return Center(
                      child: Column(
                        children: [
                          Text(
                            'Gagal memuat riwayat.',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: _loadBookings,
                            child: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    );
                  } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return Center(
                      child: Text(
                        'Tidak ada riwayat pemesanan.',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    );
                  }
                  
                  List<Booking> filteredBookings = snapshot.data!;
                  if (_selectedStatusFilter != 'Semua') {
                    filteredBookings = snapshot.data!
                        .where((booking) => booking.status == _selectedStatusFilter)
                        .toList();
                  }

                  if (filteredBookings.isEmpty) {
                    return Center(
                      child: Text(
                        'Tidak ada riwayat dengan status "$_selectedStatusFilter".',
                         style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredBookings.length,
                    itemBuilder: (context, index) {
                      final booking = filteredBookings[index];
                      final trainForCard = Train(
                        id: '', 
                        name: booking.trainName,
                        operator: booking.operator,
                        date: booking.date,
                        time: booking.time, 
                        departure: booking.departure, 
                        arrival: booking.arrival, 
                        arrivalTime: booking.arrivalTime,
                        duration: '', 
                        classType: booking.seatClass, 
                        price: booking.price, 
                        seatsLeft: 0, 
                      );

                      return SizedBox(
                        width: MediaQuery.of(context).size.width,
                        child: BookingCard(
                          booking: booking,
                          train: trainForCard,
                          onUploadProof: _isLoadingAction ? null : () => _uploadPaymentProof(booking),
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
