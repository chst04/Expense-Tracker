import java.util.List;

public abstract class SchedulerBase implements IScheduler { 

    @Override
    public abstract ScheduleResult schedule(List<Delivery> deliveries);  

    protected int findMaxDeadline(List<Delivery> deliveries) {
        int max = 0;
        for (Delivery d : deliveries) {
            if (d.getDeadline() > max) {
                max = d.getDeadline();
            }
        }
        return max;
    }

    protected double calculateTotalProfit(Delivery[] scheduledSequence) {
        double profit = 0.0;
        for (Delivery d : scheduledSequence) {
            if (d != null) {
                profit += d.getProfit();
            }
        }
        return profit;
    }
}