import java.util.*;

public class GreedyProfitScheduler extends SchedulerBase {

    private String algorithmName = "Greedy Algorithm (Profit-based)";
    private String timeComplexity = "O(n log n)";

    // Constructor
    public GreedyProfitScheduler() {
    }

    public String getAlgorithmName() {
        return algorithmName;
    }

    public String getTimeComplexity() {
        return timeComplexity;
    }

    @Override
    public ScheduleResult schedule(List<Delivery> deliveries) {

        // Validate input
        if (deliveries == null || deliveries.isEmpty()) {
            System.err.println("ERROR! Delivery list is empty or null.");
            return new ScheduleResult(new Delivery[0], new ArrayList<>(), 0.0);
        }

        // Sort by profit highest first
        List<Delivery> sortedDeliveries = new ArrayList<>(deliveries);
        sortedDeliveries.sort((d1, d2) -> Double.compare(d2.getProfit(), d1.getProfit()));

        // Find maximum deadline
        int maxDeadline = super.findMaxDeadline(deliveries);
        // Initialize scheduling arrays
        Delivery[] scheduleArray = new Delivery[maxDeadline + 1];
        boolean[] slotOccupied   = new boolean[maxDeadline + 1];
        int scheduledCount       = 0;

        // Process each delivery in sorted order
        for (Delivery d : sortedDeliveries) {
            int deadline     = d.getDeadline();
            int assignedSlot = findLatestFreeSlot(slotOccupied, deadline);

            if (assignedSlot > 0) {
                scheduleArray[assignedSlot] = d;
                slotOccupied[assignedSlot]  = true;
                scheduledCount++;
            }
        }

        // Extract scheduled deliveries in time order
        List<Delivery> scheduledDeliveries = new ArrayList<>();
        for (int i = 1; i <= maxDeadline; i++) {
            if (scheduleArray[i] != null) {
                scheduledDeliveries.add(scheduleArray[i]);
            }
        }

        // Identify unscheduled deliveries
        List<Delivery> unscheduledDeliveries = new ArrayList<>();
        Set<Delivery> scheduledSet           = new HashSet<>(scheduledDeliveries);
        for (Delivery d : deliveries) {
            if (!scheduledSet.contains(d)) {
                unscheduledDeliveries.add(d);
            }
        }

        // Calculate total profit
        double totalProfit = super.calculateTotalProfit(scheduleArray);

        return new ScheduleResult(scheduleArray, unscheduledDeliveries, totalProfit);
    }

    // Find latest free slot before or at deadline
    private int findLatestFreeSlot(boolean[] slotOccupied, int deadline) {
        for (int slot = deadline; slot >= 1; slot--) {
            if (!slotOccupied[slot]) {
                return slot;
            }
        }
        return -1;
    }

}