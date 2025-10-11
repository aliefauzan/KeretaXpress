class Station {
  final int id;
  final String name;
  final String city;

  Station({
    required this.id,
    required this.name,
    required this.city,
  });

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id'],
      name: json['name'] ?? '',
      city: json['city'] ?? '',
    );
  }

  @override
  String toString() {
    return '$name, $city';
  }
}
