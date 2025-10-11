String formatDuration(String durationInMinutesStr) {
  int totalMinutes = 0;
  // Try to parse cases like "90m" or just "90"
  final match = RegExp(r'^(\d+)m?').firstMatch(durationInMinutesStr);
  if (match != null) {
    totalMinutes = int.tryParse(match.group(1) ?? '0') ?? 0;
  } else {
    // Fallback if no 'm' and not just digits (e.g., if it's already formatted or invalid)
    // This part might need adjustment based on actual raw duration format from API
    totalMinutes = int.tryParse(durationInMinutesStr) ?? 0;
  }

  if (totalMinutes <= 0) {
    return '-'; // Or some other placeholder for invalid/zero duration
  }

  final int hours = totalMinutes ~/ 60;
  final int minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return '${hours}j ${minutes}m';
  } else if (hours > 0) {
    return '${hours}j';
  } else {
    return '${minutes}m';
  }
} 