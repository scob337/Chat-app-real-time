<!-- component -->



        
        <!-- Main Chat Area -->

            
            <!-- Chat Input -->
            
        </div>
    </div>
    <script>
      // JavaScript for showing/hiding the menu
      const menuButton = document.getElementById('menuButton');
      const menuDropdown = document.getElementById('menuDropdown');
      
      menuButton.addEventListener('click', () => {
        if (menuDropdown.classNameList.contains('hidden')) {
          menuDropdown.classNameList.remove('hidden');
        } else {
          menuDropdown.classNameList.add('hidden');
        }
      });
      
      // Close the menu if you click outside of it
      document.addEventListener('click', (e) => {
        if (!menuDropdown.contains(e.target) && !menuButton.contains(e.target)) {
          menuDropdown.classNameList.add('hidden');
        }
      });
    </script>