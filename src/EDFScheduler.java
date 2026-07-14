import java.util.*;


// Concrete scheduler implementing Earliest Deadline First (EDF).
// Extends the abstract SchedulerBase to utilize shared helper methods.

public class EDFScheduler extends SchedulerBase {

    @Override
    public ScheduleResult schedule(List<Delivery> deliveries) {

        // Input Validation: null check
        if (deliveries == null) {
            throw new IllegalArgumentException("Error: Delivery list cannot be null.");
        }

        // Graceful degradation: empty list
        if (deliveries.isEmpty()) {
            return new ScheduleResult(new Delivery[0], new ArrayList<>(), 0.0);
        }

        // Step 1: Sort by earliest deadline first (EDF)
        // Tie-breaker 1: VIP tier is prioritized over Standard
        // Tie-breaker 2: Higher profit is prioritized
        Collections.sort(deliveries, (a, b) -> {
            // 1. Sort by Deadline (Ascending)
            if (a.getDeadline() != b.getDeadline()) {
                return Integer.compare(a.getDeadline(), b.getDeadline());
            }
            
            // 2. Sort by Tier (VIP = 0, Standard = 1)
            int tierA = a.getCustomerTier().equalsIgnoreCase("VIP") ? 0 : 1;
            int tierB = b.getCustomerTier().equalsIgnoreCase("VIP") ? 0 : 1;
            
            if (tierA != tierB) {
                return Integer.compare(tierA, tierB);
            }
            
            // 3. Sort by Profit (Descending)
            // Use b compared to a to sort the profit from highest to lowest
            return Double.compare(b.getProfit(), a.getProfit());
        });

        // Step 2: Find max deadline using helper from SchedulerBase
        int maxDeadline = super.findMaxDeadline(deliveries);

        // Step 3: Allocate time slots
        Delivery[] scheduledSequence = new Delivery[maxDeadline];
        List<Delivery> unselectedDeliveries = new ArrayList<>();

        int currentTime = 0;
        for (Delivery d : deliveries) {
            if (currentTime < d.getDeadline()) {
                scheduledSequence[currentTime] = d;
                currentTime++; // Consume 1 unit of time
            } else {
                unselectedDeliveries.add(d);
            }
        }

        // Step 4: Calculate total profit using helper from SchedulerBase
        double totalProfit = super.calculateTotalProfit(scheduledSequence);

        return new ScheduleResult(scheduledSequence, unselectedDeliveries, totalProfit);
    }
}
