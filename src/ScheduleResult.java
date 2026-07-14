import java.util.List;
 //Encapsulates the outcome of the delivery scheduling process.
public class ScheduleResult {

    private final Delivery[] scheduledSequence;
    private final List<Delivery> unselectedDeliveries;
    private final double totalProfit;

    public ScheduleResult(Delivery[] scheduledSequence,
                          List<Delivery> unselectedDeliveries,
                          double totalProfit) {
        this.scheduledSequence    = scheduledSequence;
        this.unselectedDeliveries = unselectedDeliveries;
        this.totalProfit          = totalProfit;
    }

    public Delivery[] getScheduledSequence() {
        return scheduledSequence;
    }

    public List<Delivery> getUnselectedDelivery() {
        return unselectedDeliveries;
    }

    public double getTotalProfit() {
        return totalProfit;
    }
}