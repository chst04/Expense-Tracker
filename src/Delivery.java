//Delivery Scheduling (Central Class)

public class Delivery { 
	//Data fields
	private String id;
	private int deadline; //Delivery deadline
	private double profit; // Packages with associated revenue
	private String CustomerTier; //Standard or VIP
	private String category; //Type of product

	//Constructor
	public Delivery(String id, int deadline, double profit, String CustomerTier,
			String category) {
		this.id = id;
		this.deadline = deadline;
		this.profit = profit;
		this.CustomerTier = CustomerTier;
		this.category = category;
	}
	
	//Getters 
	public String getId() {
		return id;
	}
	
	public int getDeadline() {
		return deadline;
	}
	
	public double getProfit() {
		return profit;
	}
	
	public String getCustomerTier() { 
		return CustomerTier; 
		}  
	
    public String getCategory() { 
    	return category;
    	}

	//Override Methods
	
	@Override //Method 1: toString()
	public String toString() { 
		return id + " (Deadline: " + deadline +
	               ", Profit: " + profit +
	               ", Tier: " + CustomerTier +
	               ", Category: " + category + ")";
	    }

	
	@Override //Method 2: equals()
	public boolean equals(Object obj) { 
		
		//Same object reference
		if (this == obj) {
			return true;
		}
		
		//Object is null
		if (obj == null) {
			return false;
		}
		
		//Different class types
		if (getClass() != obj.getClass()) {
			return false;
		}
		
		//Safe to cast and compare by ID
		Delivery other = (Delivery) obj;
		return id.equals(other.id);
	}
	
	@Override //Method 3: hashCode()
	public int hashCode() {
		int result = id.hashCode(); //hash for String
		result = 31 * result + deadline;
		result = 31 * result + (int)profit;
		return result;
	}

}
