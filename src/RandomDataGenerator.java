import java.util.*;

public class RandomDataGenerator {

    private static final String[] TIERS      = {"VIP", "Standard"};
    private static final String[] CATEGORIES = {"Electronics", "Clothing",
                                                 "Perishables", "Home", "Food"};

    public static List<Delivery> generate(int count, int maxDeadline,
                                          double minProfit, double maxProfit) {

        if (count <= 0) {
            throw new IllegalArgumentException("Error: Number of order must be greater than 0.");
        }
        if (maxDeadline <= 0) {
            throw new IllegalArgumentException("Error: Max deadline must be greater than 0.");
        }
        if (minProfit < 0 || maxProfit < minProfit) {
            throw new IllegalArgumentException("Error: Invalid profit range.");
        }

        List<Delivery> deliveries = new ArrayList<>();
        Random random             = new Random();

        for (int i = 1; i <= count; i++) {
            String id       = String.format("RND%03d", i);
            int deadline    = random.nextInt(maxDeadline) + 1;
            double profit   = minProfit + (maxProfit - minProfit) * random.nextDouble();
            profit          = Math.round(profit * 100.0) / 100.0;
            String tier     = TIERS[random.nextInt(TIERS.length)];
            String category = CATEGORIES[random.nextInt(CATEGORIES.length)];

            deliveries.add(new Delivery(id, deadline, profit,tier,category));
        }

        System.out.println("Successfully generated " + count + " random deliveries.");
        return deliveries;
    }
}