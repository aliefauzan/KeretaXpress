class Booking {
  final String transactionId;
  final String trainName;
  final String operator;
  final String date;
  final String time;
  final String departure;
  final String arrival;
  final String arrivalTime;
  final String status;
  final String price;
  final String passengerName;
  final String passengerId;
  final String passengerDob;
  final String passengerGender;
  final String seatClass;
  final String seatNumber;

  Booking({
    required this.transactionId,
    required this.trainName,
    required this.operator,
    required this.date,
    required this.time,
    required this.departure,
    required this.arrival,
    required this.arrivalTime,
    required this.status,
    required this.price,
    required this.passengerName,
    required this.passengerId,
    required this.passengerDob,
    required this.passengerGender,
    required this.seatClass,
    required this.seatNumber,
  });

  factory Booking.dummy() {
    return Booking(
      transactionId: '35151859256378',
      trainName: 'Serayu 255',
      operator: 'PT. KAI',
      date: '16 Nov 2024',
      time: '00:15',
      departure: 'Kiaracondong',
      arrival: 'Jatinegara',
      arrivalTime: '03:55',
      status: 'Sudah dibayar',
      price: 'Rp150.000',
      passengerName: 'Alif Lohen',
      passengerId: '77773023030043043',
      passengerDob: '30 Mar 2003',
      passengerGender: 'Laki-laki',
      seatClass: 'Ekonomi',
      seatNumber: 'A1',
    );
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    final train = json['train'] ?? {};
    final departureStation = train['departure_station'] ?? {};
    final arrivalStation = train['arrival_station'] ?? {};

    String statusFromServer = json['status']?.toString() ?? '';
    String displayStatus = statusFromServer.isEmpty ? 'pending' : statusFromServer;

    return Booking(
      transactionId: json['transaction_id']?.toString() ?? '',
      trainName: train['name'] ?? '',
      operator: train['operator'] ?? '',
      date: json['travel_date']?.toString().substring(0, 10) ?? '',
      time: train['departure_time'] != null
          ? DateTime.parse(train['departure_time']).toLocal().toString().substring(11, 16)
          : '',
      departure: departureStation['name'] ?? '',
      arrival: arrivalStation['name'] ?? '',
      arrivalTime: train['arrival_time'] != null
          ? DateTime.parse(train['arrival_time']).toLocal().toString().substring(11, 16)
          : '',
      status: displayStatus,
      price: json['total_price']?.toString() ?? '',
      passengerName: json['passenger_name'] ?? '',
      passengerId: json['passenger_id_number']?.toString() ?? '',
      passengerDob: json['passenger_dob']?.toString() ?? '',
      passengerGender: json['passenger_gender'] ?? '',
      seatClass: train['class_type'] ?? '',
      seatNumber: json['seat_number']?.toString() ?? '',
    );
  }
}