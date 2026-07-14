import java.io.*;
import java.util.*;

public class FileDataLoader {

    public static List<Delivery> loadFromFile() {
        List<Delivery> deliveries = new ArrayList<>();

        File file = new File("sample_data.txt");// if the sample data cant load can change to "sample_data.txt"
        if (!file.exists()) {                       // make sure sample data is inside the src
            throw new IllegalArgumentException("Error: File not found.");
        }

        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {

                // Skip header
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                // Skip blank lines
                if (line.trim().isEmpty()) continue;

                String[] parts = line.split(",");

                // Validate column count
                if (parts.length != 5) {
                    System.err.println("WARNING: Skipping malformed line -> " + line);
                    continue;
                }

                try {
                    String id           = parts[0].trim();
                    int deadline        = Integer.parseInt(parts[1].trim());
                    double profit       = Double.parseDouble(parts[2].trim());
                    String customerTier = parts[3].trim();
                    String category     = parts[4].trim();

                    if (deadline <= 0) {
                        System.err.println("WARNING: Skipping invalid deadline -> " + id);
                        continue;
                    }
                    if (profit < 0) {
                        System.err.println("WARNING: Skipping negative profit -> " + id);
                        continue;
                    }

                    deliveries.add(new Delivery(id, deadline, profit, customerTier, category));

                } catch (NumberFormatException e) {
                    System.err.println("WARNING: Skipping bad number format -> " + line);
                }
            }

        } catch (IOException e) {
            throw new RuntimeException("Error reading file: " + e.getMessage());
        }

        if (deliveries.isEmpty()) {
            throw new RuntimeException("Error: No valid deliveries loaded from file.");
        }

        return deliveries;
    }
}