import 'package:flutter/material.dart';
import 'package:keretaxpress/models/train.dart';
import 'package:keretaxpress/widgets/train/train_card.dart';

class TrainListResults extends StatelessWidget {
  final List<Train> trains;
  final bool isLoading;
  final String? errorMessage;
  final Function(Train) onTrainTap;
  final Function() onRefresh;

  const TrainListResults({
    super.key,
    required this.trains,
    required this.isLoading,
    this.errorMessage,
    required this.onTrainTap,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: Colors.red,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.red,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
                onPressed: onRefresh, 
                icon: const Icon(Icons.refresh), 
                label: const Text('Coba Lagi')
            )
          ],
        ),
      );
    }

    if (trains.isEmpty) {
      return const Center(
        child: Text(
          'Tidak ada kereta yang tersedia untuk filter ini.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey,
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(), // Handled by parent scroll
      itemCount: trains.length,
      itemBuilder: (context, index) {
        final train = trains[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: TrainCard(
            train: train,
            onTap: () => onTrainTap(train),
          ),
        );
      },
    );
  }
} 