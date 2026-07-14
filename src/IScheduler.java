import java.util.List;

/**
 * Interface defining the contract for all scheduling algorithms.
 * Every concrete scheduler must implement this interface.
 */

public interface IScheduler {
    ScheduleResult schedule(List<Delivery> deliveries);
}