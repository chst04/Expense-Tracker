import java.util.*;

public class BruteForceScheduler extends SchedulerBase {

    private List<List<Delivery>> allSequences = new ArrayList<>();
    private double totalBestProfit = 0;

    @Override
    public ScheduleResult schedule(List<Delivery> deliveries) {

        if (deliveries == null) {
            throw new IllegalArgumentException("Error: Delivery list cannot be null.");
        }
        if (deliveries.isEmpty()) {
            return new ScheduleResult(new Delivery[0], new ArrayList<>(), 0.0);
        }

        // Save original list to find unselected later
        List<Delivery> originalList = new ArrayList<>(deliveries);

        // Reset before each run
        allSequences.clear();
        totalBestProfit = 0;

        // Generate ALL permutations of the full list
        generatePermutations(new ArrayList<>(), new ArrayList<>(deliveries));

        System.out.println("Total permutations generated: " + allSequences.size());

        // Calculate profit for each permutation
        List<List<Object>> allSequenceProfits = calculate(allSequences);

        // Find best sequence
        List<Delivery> finalList = compare(allSequenceProfits);

        // Split into scheduled and unselected
        List<Delivery> scheduledList  = new ArrayList<>();
        List<Delivery> unselectedList = new ArrayList<>();
        int slot = 0;

        for (Delivery d : finalList) {
            slot++;
            if (d.getDeadline() >= slot) {
                scheduledList.add(d);   // met deadline → scheduled
            } else {
                unselectedList.add(d);  // missed deadline → unselected
            }
        }
        Delivery[] finalArray = scheduledList.toArray(new Delivery[0]);

        return new ScheduleResult(finalArray, unselectedList, totalBestProfit);
    }

    // Generate ALL permutations
    private void generatePermutations(List<Delivery> current, List<Delivery> remaining) {

        // Base case: no more remaining → full permutation complete
        if (remaining.isEmpty()) {
            allSequences.add(new ArrayList<>(current));
            return;
        }

        // Try placing each remaining delivery at next position
        for (int i = 0; i < remaining.size(); i++) {
            List<Delivery> newCurrent   = new ArrayList<>(current);
            List<Delivery> newRemaining = new ArrayList<>(remaining);

            Delivery next = newRemaining.remove(i);
            newCurrent.add(next);

            // Recurse with updated lists
            generatePermutations(newCurrent, newRemaining);
        }
    }

    // Calculate profit for each permutation 
    public List<List<Object>> calculate(List<List<Delivery>> sequences) {
        List<List<Object>> allSequenceProfits = new ArrayList<>();

        for (List<Delivery> sequence : sequences) {
            List<Object> combined = new ArrayList<>(sequence);
            int slot              = 0;
            double profit         = 0.0;

            for (Delivery d : sequence) {
                slot++;
                // Job is valid only if deadline >= current slot
                if (d.getDeadline() >= slot) {
                    profit += d.getProfit();
                }
            }

            combined.add(profit); // profit stored as last element
            allSequenceProfits.add(combined);
        }

        return allSequenceProfits;
    }

    // Find sequence with highest profit 
    public List<Delivery> compare(List<List<Object>> allSequenceProfits) {
        double maxProfit = 0;
        int bestIndex    = 0;

        for (int i = 0; i < allSequenceProfits.size(); i++) {
            List<Object> sequence = allSequenceProfits.get(i);
            int last              = sequence.size() - 1;
            double profit         = (double) sequence.get(last); // cast to double

            if (profit > maxProfit) {
                maxProfit = profit;
                bestIndex = i;
            }
        }

        totalBestProfit = maxProfit;

        // Extract deliveries from best sequence
        List<Object> best = new ArrayList<>(allSequenceProfits.get(bestIndex));
        best.remove(best.size() - 1); // remove profit element

        List<Delivery> result = new ArrayList<>();
        for (Object o : best) {
            result.add((Delivery) o);
        }

        return result;
    }
}