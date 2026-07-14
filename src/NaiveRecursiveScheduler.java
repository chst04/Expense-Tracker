import java.util.*;

public class NaiveRecursiveScheduler extends SchedulerBase {

    private Delivery[] bestSchedule;
    private double bestProfit;

    @Override
    public ScheduleResult schedule(List<Delivery> deliveries) {

        if (deliveries == null) {
            throw new IllegalArgumentException("Error: Delivery list cannot be null.");
        }
        if (deliveries.isEmpty()) {
            return new ScheduleResult(new Delivery[0], new ArrayList<>(), 0.0);
        }

        int maxDeadline = super.findMaxDeadline(deliveries);

        bestSchedule = new Delivery[maxDeadline];
        bestProfit   = 0.0;

        Delivery[] currentSchedule = new Delivery[maxDeadline];
        recurse(deliveries, 0, currentSchedule, maxDeadline);

        List<Delivery> unselected = findUnselected(deliveries, bestSchedule);

        return new ScheduleResult(bestSchedule, unselected, bestProfit);
    }

    private void recurse(List<Delivery> deliveries, int index,
                         Delivery[] currentSchedule, int maxDeadline) {

        // Base case
        if (index == deliveries.size()) {
            double currentProfit = super.calculateTotalProfit(currentSchedule);
            if (currentProfit > bestProfit) {
                bestProfit   = currentProfit;
                bestSchedule = currentSchedule.clone();
            }
            return;
        }

        Delivery current = deliveries.get(index);

        // Branch 1: INCLUDE
        int assignedSlot = findLatestFreeSlot(currentSchedule, current.getDeadline());
        if (assignedSlot != -1) {
            currentSchedule[assignedSlot] = current;
            recurse(deliveries, index + 1, currentSchedule, maxDeadline);
            currentSchedule[assignedSlot] = null; // backtrack
        }

        // Branch 2: SKIP
        recurse(deliveries, index + 1, currentSchedule, maxDeadline);
    }

    private int findLatestFreeSlot(Delivery[] schedule, int deadline) {
        for (int slot = deadline - 1; slot >= 0; slot--) {
            if (schedule[slot] == null) {
                return slot;
            }
        }
        return -1;
    }

    private List<Delivery> findUnselected(List<Delivery> allDeliveries,
                                          Delivery[] finalSchedule) {
        Set<String> scheduledIds = new HashSet<>();
        for (Delivery d : finalSchedule) {
            if (d != null) {
                scheduledIds.add(d.getId());
            }
        }

        List<Delivery> unselected = new ArrayList<>();
        for (Delivery d : allDeliveries) {
            if (!scheduledIds.contains(d.getId())) {
                unselected.add(d);
            }
        }
        return unselected;
    }
}