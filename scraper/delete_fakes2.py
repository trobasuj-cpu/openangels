import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def delete_fakes():
    # Only fake records have past_investments set, because the column was just added
    try:
        res = supabase.table("investors").delete().neq("past_investments", "{}").execute()
        print("Delete response:", res)
    except Exception as e:
        print("Error:", e)
        
if __name__ == "__main__":
    delete_fakes()
