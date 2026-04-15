import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='cbt_db'
    )
    print("SUCCESS: Connected with root/empty")
    connection.close()
except Exception as e:
    print(f"FAILED: {e}")
