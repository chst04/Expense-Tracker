import java.util.*;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=".repeat(60));
        System.out.println("   E-Commerce Delivery Task Scheduler System (DBTS)");
        System.out.println("=".repeat(60));

        // Select Data Input Method 
        List<Delivery> deliveries = null;

        while (deliveries == null) {
            System.out.println("\nSelect Data Input Method:");
            System.out.println("  1. Read from file (sample_data.txt)");
            System.out.println("  2. Random generation");
            System.out.print("Enter choice (1 or 2): ");

            String inputChoice = scanner.nextLine().trim();

            switch (inputChoice) {
                case "1":
                    deliveries = handleFileInput();
                    break;
                case "2":
                    deliveries = handleRandomInput(scanner);
                    break;
                default:
                    System.out.println("Invalid choice. Please enter 1 or 2.");
            }
        }

        // STEP 2: Select Algorithm 
        boolean running = true;

        while (running) {
            System.out.println("\n" + "=".repeat(60));
            System.out.println("Select Scheduling Algorithm:");
            System.out.println("  1. Greedy Algorithm (Profit-based)  ");
            System.out.println("  2. Naive Recursive                  ");
            System.out.println("  3. Brute Force                      ");
            System.out.println("  4. Earliest Deadline First (EDF)    ");
            System.out.println("  5. Exit");
            System.out.print("Enter choice (1-5): ");

            String algoChoice = scanner.nextLine().trim();

            if (algoChoice.equals("5")) {
            	System.out.println("Exiting......");
                System.out.println("\nThank you for using ours DBTS. Goodbye!");
                break;
            }

            IScheduler scheduler = null;
            String algoName      = "";

            switch (algoChoice) {
                case "1":
                    scheduler = new GreedyProfitScheduler();
                    algoName  = "Greedy Algorithm (Profit-based)";
                    break;
                case "2":
                    scheduler = new NaiveRecursiveScheduler();
                    algoName  = "Naive Recursive";
                    break;
                case "3":
                    scheduler = new BruteForceScheduler();
                    algoName  = "Brute Force";
                    break;
                case "4":
                    scheduler = new EDFScheduler();
                    algoName  = "Earliest Deadline First (EDF)";
                    break;
                default:
                    System.out.println("Invalid choice. Please enter 1 to 5.");
                    continue;
            }

            //Display Output 
            System.out.println("\n" + "=".repeat(60));
            System.out.println("  Algorithm : " + algoName);
            System.out.println("=".repeat(60));

            // Print all order details
            System.out.println("\n[ All Order Details ]");
            printDeliveries(deliveries);

            // Run algorithm on fresh copy
            try {
                ScheduleResult result = scheduler.schedule(new ArrayList<>(deliveries));
                printResult(result);
            } catch (Exception e) {
                System.err.println("ERROR: " + e.getMessage());
            }

            // Ask to continue
            String again = "";
            while (true) {
                System.out.print("\nRun another algorithm? (y/n): ");
                again = scanner.nextLine().trim().toLowerCase();
                
                if (again.equalsIgnoreCase("y") || again.equalsIgnoreCase("n")) {
                    break; // Exit the validation loop on valid input
                } else {
                    System.out.println("Invalid input. Please enter 'y' or 'n'.");
                }
            }

            if (again.equalsIgnoreCase("n")) {
                System.out.println("\nThank you for using ours DBTS. Goodbye!");
                running = false;
            }
        }

        scanner.close();
    }

    // File Input Handler 
    private static List<Delivery> handleFileInput() {
        try {
            List<Delivery> deliveries = FileDataLoader.loadFromFile();
            System.out.println("Data loaded successfully from sample_data.txt.");
            return deliveries;
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            return null;
        }
    }

    // Random Input Handler
    private static List<Delivery> handleRandomInput(Scanner scanner) {
        try {
            System.out.print("How many orders to generate? => ");
            int count = Integer.parseInt(scanner.nextLine().trim());

            System.out.print("Max deadline (days)? => ");
            int maxDeadline = Integer.parseInt(scanner.nextLine().trim());

            System.out.print("Min profit (RM)? => ");
            double minProfit = Double.parseDouble(scanner.nextLine().trim());

            System.out.print("Max profit (RM)? => ");
            double maxProfit = Double.parseDouble(scanner.nextLine().trim());

            List<Delivery> deliveries = RandomDataGenerator.generate(
                    count, maxDeadline, minProfit, maxProfit);
            System.out.println("Random data generated successfully.");
            return deliveries;

        } catch (NumberFormatException e) {
            System.err.println("ERROR: Please enter valid numbers.");
            return null;
        } catch (IllegalArgumentException e) {
            System.err.println("ERROR: " + e.getMessage());
            return null;
        }
    }

    // Print All Input Deliveries
    private static void printDeliveries(List<Delivery> deliveries) {
        System.out.printf("%-10s %-10s %-12s %-10s %-15s%n",
                "ID", "Deadline", "Profit(RM)", "Tier", "Category");
        System.out.println("-".repeat(60));
        for (Delivery d : deliveries) {
            System.out.printf("%-10s %-10d %-12.2f %-10s %-15s%n",
                    d.getId(), d.getDeadline(), d.getProfit(),
                    d.getCustomerTier(), d.getCategory());
        }
        System.out.println("-".repeat(60));
        System.out.println("Total: " + deliveries.size() + " deliveries\n");
    }

    //Print Schedule Result 
    private static void printResult(ScheduleResult result) {

        Delivery[] sequence           = result.getScheduledSequence();
        List<Delivery> unselected     = result.getUnselectedDelivery();

        // (b) Selected sequence
        System.out.println("[ Selected Sequence ]");
        System.out.printf("%-5s %-10s %-10s %-12s %-10s%n",
                "Slot", "ID", "Deadline", "Profit(RM)", "Tier");
        System.out.println("-".repeat(55));

        int slot = 1;
        for (Delivery d : sequence) {
            if (d != null) {
                System.out.printf("%-5d %-10s %-10d %-12.2f %-10s%n",
                        slot, d.getId(), d.getDeadline(),
                        d.getProfit(), d.getCustomerTier());
            }
            slot++;
        }

        // Total profit
        System.out.println("\n[ Total Profit ]");
        System.out.println("-".repeat(55));
        System.out.printf("  Scheduled    : %d deliveries%n",
                (int) Arrays.stream(sequence).filter(d -> d != null).count());
        System.out.printf("  Total Profit : RM %.2f%n", result.getTotalProfit());

        //Unselected jobs
        System.out.println("\n[ Unselected Deliveries ]");
        System.out.println("-".repeat(55));
        if (unselected.isEmpty()) {
            System.out.println("  None — all deliveries were scheduled!");
        } else {
            System.out.printf("%-10s %-10s %-12s %-10s%n",
                    "ID", "Deadline", "Profit(RM)", "Tier");
            for (Delivery d : unselected) {
                System.out.printf("%-10s %-10d %-12.2f %-10s%n",
                        d.getId(), d.getDeadline(),
                        d.getProfit(), d.getCustomerTier());
            }
            System.out.println("-".repeat(55));
            System.out.println("  Total unselected: " + unselected.size() + " deliveries");
        }
        System.out.println("=".repeat(55));
    }
}